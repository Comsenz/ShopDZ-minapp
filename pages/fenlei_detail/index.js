//index.js
//获取应用实例
const app = getApp()

var WxParse = require('../../plugins/wxParse/wxParse.js');  
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({
  data: {
    navbar:[],
    // tab菜单
    object: [],
    artileList:[],
    goodsInfo:[],//首页商品详情
    currentFlag: 0,
    name:null,
    is_paly:true,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // 轮播图
    imgUrls: [
      // '../../img/banner.jpg',
      // '../../img/login.jpg',
      // '../../img/shops2.png',
    ],
    footer_data: {//页面底部信息
      record_number: '京ICP备13042263号-4',
      footer_info: 'ShopDZ INC.'
    },
    commodity:[],
    interval: 3000,
    duration: 500,
    showList: 1,
    loadLock: false,
    num:0,//购物车数量
    page:1,//页码
    gc_name: null,//商品列表类型
    goods_list: [],//商品列表
    is_display:true,
  },
  touchStart(e) {
    this.setData({
      "startX": e.changedTouches[0].clientX,
      "startY": e.changedTouches[0].clientY
    });
  },
  touchEnd(e) {
    var startX = this.data.startX;
    var startY = this.data.startY;
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    if (endX - startX > 50 && Math.abs(endY - startY) < 50) {
      this.setData({
        showList: 1
      })
    }
  },
  onLoad: function(options) {
    var that = this;
    if(options.type ==2){
      that.search(options.q);
    }else{
      var gc_id = options.id;
      that.details_list(gc_id);
    }
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          this.setData({
            usershow: false,
          })
        } else {
          this.setData({
            usershow: true,
          })
        }
      }
    });
  },
  search: function (e) {
    var self = this;
    var q = e;
    wx.request({
      url: curl + 'api.php/Goods/goods_list?gc_id=&p=1&q=' + q,
      method: 'GET',
      success: function (res) {
        console.log(res.data);
        if (res.data.code == 0) {
          var list = res.data.data.goods_list;
          if (list.length < 0 || list.length == 0) {
            var gc_name = '暂无搜索结果';
          } else {
            var gc_name = '';
          }
          self.setData({
            gc_name: gc_name,
            goods_list: list,
            showList: 0,
            is_display: false,
          });
        }
      }
    })
  },
  gotobtn:function(){
    var url = '../fenlei/index';
    wx.switchTab({
      url: url,
    });
  },
  onShow: function (options){

  },

  // 菜单切换
  _switch: function(e) {
    var that = this;
    that.setData({
      currentFlag: e.currentTarget.dataset.index
    })
    console.log(that.data.object[that.data.currentFlag])
  },
  prevenD:function(){
    return
  },
  details_list:function(e){
    var self = this;
    var gc_id = e;
    var page = self.data.page;
    var goods_list = self.data.goods_list;
    var is_paly = self.data.is_paly;
    wx.request({
      url: curl +'api.php/Goods/goods_list',
      data: {gc_id: gc_id,p:page},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          if (res.data.data.goods_list.length >0){
            if (res.data.data.categorys.desc) {
              var gc_name = res.data.data.categorys.desc;
            } else {
              var gc_name = res.data.data.categorys.gc_name;
            }
            page++;

            wx.setNavigationBarTitle({
              title: res.data.data.categorys.gc_name
            })


            is_paly = true;
            goods_list = goods_list.concat(res.data.data.goods_list);
          } else if(self.data.goods_list.length ==0){
            var gc_name = res.data.data.categorys.gc_name+'分类中暂无商品';
            is_paly = false;
          }
          if (goods_list){
            self.setData({
              gc_name: gc_name,
              goods_list: goods_list,
              gc_id: gc_id,
              page:page,
              is_paly: is_paly,
              is_display:false,
            });
          }
        }
      }
    })
  },

  hide_mask: function () {
    var that = this;
    setTimeout(function () {
      that.setData({
        hasUserInfo: true,
        usershow: false,
      })
    }, 200)
  },
  getUserInfo: function (e) {
    var that = this;
    if (e.detail.userInfo) {
      console.log(e.detail.userInfo);
      app.globalData.userInfo = e.detail.userInfo

    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {
            that.setData({
              hasUserInfo: false,
               usershow: true,
            })
            console.log('用户点击了“返回授权”')
          }
        },
        complete: function () {
          that.setData({
            hasUserInfo: false,
            usershow: true,
          })
        }
      })
    }
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var self = this;
    var gc_id = self.data.gc_id;
    if (!self.loadLock) {
      if (self.data.is_paly) {
        self.details_list(gc_id);
      }
      self.setData({
        "loadLock": true
      });

    }
  },
})