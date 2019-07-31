import { promisify } from '../../utils/promise.util'
import { $init, $digest } from '../../utils/common.util'

const wxUploadFile = promisify(wx.uploadFile)
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  data: {
    titleCount: 0,
    contentCount: 0,
    cause:null,
    title: '',
    order_amount:null,
    order_sn: null,
    content: '',
    causes_id:null,
    causes:null,
    images: []
  },
  onLoad(options) {
    var self = this;
    var order_sn = options.order_sn;
    // var order_sn = '201905301414049800';
    self.cause();
    self.dataList(order_sn);
    $init(this)
  },
  handleTitleInput(e) {
    const value = e.detail.value
    this.data.title = value
    this.data.titleCount = value.length
    $digest(this)
  },
 
  handleContentInput(e) {
    const value = e.detail.value
    this.data.content = value
    this.data.contentCount = value.length
    $digest(this)
  },
  chooseImage(e) {
    var slef = this;
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        var tempFilePaths = res.tempFilePaths;  
        var uploadImgCount = 0;
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempFilePaths[0],
          encoding:'base64',
          success:function(data){
            var img = data.data;
            slef.refundimg(img);
          }
        }); 
        $digest(this)
      }
    })
  },
  refundimg:function(img){
    var self = this;
    var base64_string = img;
    var key = wx.getStorageSync('key');
    var data ={
      type:'refund',
      key:key,
      base64_string: base64_string
    }
      wx.request({
        url: curl +'api.php/Presales/refundimg',
        data:data,
        method:'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success:function(res){
          if(res.data.code ==0){
            var url = res.data.data.url;
            var images = self.data.images.concat(url)
            if (images.length <= 3){
              self.setData({
                images: images
              });
            }else{
              wx.showToast({
                title: '不能过于三张',
                icon: 'success',
                duration: 2000
              });
            }
          }
        }
      })
  },
  //删除图片
  removeImage(e) {
    const idx = e.target.dataset.idx;
    var self = this;
    if (idx == 2) {
      var img = self.data.images;
      img.pop();
      self.setData({
        images: img,
      })
    }
    var img = self.data.images;
    
    if(img.length ==1){
      self.setData({ images: [] });
    }else{
      img.splice(idx, 1);
      self.setData({ images: img });
    }
  },
  //获取退款原因
  cause:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/presales/cause?key='+key,
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == 0){
          var reason = res.data.data;
          self.setData({
            cause: reason,
          })
        }
      }
    })
  },
  //下拉
  bindRegionChang: function (e) {
    var self = this;
    var causes_id = self.data.cause[e.detail.value].causes_id;
    var causes = self.data.cause[e.detail.value].causes_name;
    if (causes_id){
      self.setData({
        causes_id: causes_id,
        causes: causes,
      });
    }
  },
  dataList:function(id){
    var self = this;
    var order_sn = id;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/orders/orderdetails',
      data: { order_sn:order_sn,key:key},
      method:'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        if(res.data.code == 0){
          var order = res.data.data.order_amount;
          self.setData({
            order_amount: order,
            order_sn: order_sn,
          })
        }
      }
    })
  },
  submitForm:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var order_sn = self.data.order_sn;
    var causes = self.data.content;
    var img = self.data.images;
    var causes_id = self.data.causes_id;
    if (!causes_id) {
      wx.showToast({
        title: '退款原因不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退款原因不能为空');
      return;
    }
    if (!img.length>0) {
      wx.showToast({
        title: '退款凭证不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退货凭证不能为空');
      return;
    }
    if (!causes){
      wx.showToast({
        title: '退款说明不能为空',
        icon: 'none',
        duration: 2000
      });
      console.log('退货说明不能为空');
      return;
    }
    var test = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g;
    if (causes.match(test)) {
      wx.showToast({
        title: '不能使用emoji表情',
        icon: 'none',
      })
      return
    }
    
    var params_wx = {
      order_sn: order_sn,
      causes_id: causes_id,
      causes: causes,
      img1:img[0],
      img2:img[1],
      img3:img[2],
      key: key,
      type:1,
    };
    if (params_wx){
      wx.request({
        url: curl +'api.php/presales/refund',
        data: params_wx,
        method:'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8' // 默认值
        },
        success:function(res){
          console.log(res.data);
          if(res.data.code ==0){
            wx.showToast({
              title: res.data.msg,
              icon: 'success',
              duration: 2000
            });
            setTimeout(function () {  //使用  setTimeout（）方法设定定时2000毫秒
              wx.navigateBack();//返回上一页面
            }, 2000);
          }
        }
      })
    }
  },
})